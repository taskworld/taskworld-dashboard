import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const update = functions.https.onRequest(async (request, response) => {
  try {
    const matchingToken = await admin
      .database()
      .ref('tokens')
      .child(request.body.token)
      .once('value')
    if (matchingToken.val() !== true) {
      response.status(401).json({ error: 'Token not valid' })
      return
    }
    await admin
      .database()
      .ref('widgets')
      .child(request.body.widget)
      .update({
        contents: request.body.contents,
        updated: admin.database.ServerValue.TIMESTAMP,
      })
    response.status(200).json({ ok: true })
  } catch (e) {
    console.error('update endpoint failed', e)
    response.status(500).json({ error: 'Internal server error lol' })
  }
})
