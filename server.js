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

app.post('/api/sendGroupMessage', async (req, res) => {
  try {
    await poolConnect;
    const { group_id, sender_id, message_content } = req.body;

    const userResult = await pool.request()
      .input('user_id', sql.Int, sender_id)
      .query(`SELECT first_name, last_name FROM Users WHERE user_id = @user_id`);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.recordset[0];
    const sender_name = `${user.first_name} ${user.last_name}`;

    const result = await pool.request()
      .input('group_id', sql.Int, group_id)
      .input('sender_id', sql.Int, sender_id)
      .input('message_content', sql.NVarChar(sql.MAX), message_content)
      .query(`
        INSERT INTO group_messages (group_id, sender_id, message_content)
        VALUES (@group_id, @sender_id, @message_content);
        SELECT SCOPE_IDENTITY() AS message_id;
      `);

    const messageId = result.recordset[0].message_id;

    res.json({
      success: true,
      message_id: messageId,
      sender_name: sender_name,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send group message', details: error.message });
  }
});
