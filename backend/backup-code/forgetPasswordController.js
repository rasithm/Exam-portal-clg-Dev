export const requestStudentReset = async (req, res) => {
  try {
    const { regNo, email } = req.body;
    if (!regNo || !email) return res.status(400).json({ message: "regNo and email required" });

    const student = await Student.findOne({ rollNumber: regNo });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Rate-limit: count recent requests for this rollNumber
    const windowStart = new Date(Date.now() - REQUEST_WINDOW_MIN * 60 * 1000);
    const recentCount = await PasswordResetRequest.countDocuments({
      rollNumber: regNo,
      requestedAt: { $gte: windowStart },
    });
    if (recentCount >= MAX_REQUESTS_WINDOW) {
      return res.status(429).json({ message: "Too many reset requests. Please wait and try later." });
    }

    // If student has an assigned email and it matches, go OTP flow
    // if (student.email && student.email.toLowerCase().trim() === String(email).toLowerCase().trim()) {
    //   const otp = generateOTP();
    //   const otpHash = await bcrypt.hash(otp, 10);
    //   const expires = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

    //   const reqDoc = await PasswordResetRequest.create({
    //     student: student._id,
    //     rollNumber: regNo,
    //     requestedEmail: email.trim(),
    //     otpHash,
    //     otpExpiresAt: expires,
    //     status: "otp_sent",
    //     purpose: "student_reset",
    //   });

      
    //   const link = `${process.env.FRONTEND_URL}/reset/verify?req=${reqDoc._id}`;
    //   const html = `<p>Your password reset code is <strong>${otp}</strong>.</p>
    //                 <p>It expires in ${OTP_TTL_MIN} minutes.</p>
    //                 <p>If you didn't request this, ignore this message.</p>
    //                 <p><small>Or click to verify: <a href="${link}">${link}</a></small></p>`;

    //   await sendOtpMail(email.trim(), "ExamPortal Password Reset OTP", html);

    //   return res.json({ message: "OTP sent to registered email", requestId: reqDoc._id });
    // }
    const inputEmail = String(email).toLowerCase().trim();

    // ✅ Case 1: student already has email
    if (student.email) {
      if (student.email.toLowerCase().trim() !== inputEmail) {
        return res.status(400).json({
          message: "Email does not match the registered email for this student"
        });
      }

      // ---------- OTP FLOW ----------
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const expires = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

      const reqDoc = await PasswordResetRequest.create({
        student: student._id,
        rollNumber: regNo,
        requestedEmail: inputEmail,
        otpHash,
        otpExpiresAt: expires,
        status: "otp_sent",
        purpose: "student_reset",
      });

      const link = `${process.env.FRONTEND_URL}/reset/verify?req=${reqDoc._id}`;
      const html = `<p>Your password reset code is <strong>${otp}</strong>.</p>
                    <p>It expires in ${OTP_TTL_MIN} minutes.</p>
                    <p>If you didn't request this, ignore this message.</p>
                    <p><small>Or click to verify: <a href="${link}">${link}</a></small></p>`;

      await sendOtpMail(email.trim(), "ExamPortal Password Reset OTP", html);

      return res.json({ message: "OTP sent", requestId: reqDoc._id });
    }

    // ✅ Case 2: no email assigned → ask admin
    return res.status(200).json({
      message: "Student has no email assigned. Please request admin approval.",
      noEmail: true
    });


    // If student email missing or does not match -> create pending assignment request
    const existingPending = await PasswordResetRequest.findOne({
      rollNumber: regNo,
      status: "pending_email_assign",
      requestedEmail: email.trim(),
    });

    if (existingPending) {
      // Already pending: don't spam admin
      return res.status(200).json({ message: "A request is already pending admin approval" });
    }

    const pending = await PasswordResetRequest.create({
      student: student._id,
      rollNumber: regNo,
      requestedEmail: email.trim(),
      status: "pending_email_assign",
    });

    // TODO: notify admins (via socket or DB notifications)
    // Example: io?.emit("emailAssignRequest", { id: pending._id, rollNumber: regNo, email });

    return res.json({ message: "Request recorded and forwarded to admin for approval", requestId: pending._id });
  } catch (err) {
    console.error("requestStudentReset error", err);
    return res.status(500).json({ message: "Server error" });
  }
};