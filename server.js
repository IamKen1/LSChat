app.post('/api/sendMessage', upload.single('file'), async (req, res) => {
  try {
    await poolConnect;
    const { user_id, message_content, token } = req.body;

    let messageType = 'text';
    let messageContent = message_content || '';

    if (req.file) {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      console.log('File uploaded successfully:', fileUrl); // Debug log
      messageContent = messageContent
        ? `${messageContent}\n[File: ${fileUrl}]`
        : `[File: ${fileUrl}]`;
      messageType = 'file';
    }

    // Store message in database
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('message_content', sql.NVarChar(sql.MAX), messageContent)
      .input('token', sql.NVarChar(255), token)
      .input('message_type', sql.NVarChar(50), messageType)
      .execute('sp_store_chat_message');

    const messageId = result.recordset[0].message_id;

    // Get recipient's FCM token for notification
    const tokenResult = await pool.request()
      .input('token', sql.NVarChar(255), token)
      .query(`
        SELECT B.fcm_token, A.name AS notification_title
        FROM Accounts A
        INNER JOIN Users B ON A.user_id = B.user_id
        WHERE A.channel = @token
      `);

    if (tokenResult.recordset.length > 0) {
      const { fcm_token, notification_title } = tokenResult.recordset[0];

      // Send Firebase notification
      const payload = {
        token: fcm_token,
        data: {
          type: 'chat',
          title: notification_title,
          message: messageContent,
          messageId: messageId.toString(),
          token: token,
        },
      };

      await admin.messaging().send(payload);
    }

    res.json({
      success: true,
      messageId: messageId,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message', sqlError: error.message, params: req.body });
  }
});
