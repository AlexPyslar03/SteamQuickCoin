const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
admin.initializeApp();

const authorization = "Basic ВАШ ТОКЕН";
const initial_payment_msg = "Списываем оплату за заказ";
const my_url = "";

console.log("Hello from Functions!")

const confirmPayment = async (payment_id) => {
  await admin.firestore().collection('orders').where("payment_id", "==", payment_id)
  .limit(1)
  .get()
  .then(snapshot => {
      if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0].ref;
          firstDoc.update({paid: true}).then(() => {
              console.log('Документ успешно обновлен');
            })
            .catch(err => {
              console.log('Ошибка обновления документа', err);
            });
        } else {
          console.log("документы не найдены");
        }
  })
  .catch(err => {
      console.log('Ошибка получения документа', err);
      return null
  });
}

const getPayment = async (payment_id) => {
  const url = `https://api.yookassa.ru/v3/payments/${payment_id}/capture`;

  var headers = {
      "Authorization": authorization,
      "Idempotence-Key": uuidv4().toString(),
      "Content-Type": 'application/json'
  };

  return await axios.post(url, {}, {
      headers: headers,
  }).then((res) => res.data).then(async (res) => {
      functions.logger.log("Платеж успешно подтвержден", res);
      return true;
  }).catch((err) => {
      functions.logger.log("Ошибка при подтверждении платежа", err);
      return false;
  });
}

exports.UkassaWebHook = functions.https.onRequest(async (request, response) => {
  if (request.body.event == "payment.waiting_for_capture") {
      let payment_id = request.body.object.id;
      let status = request.body.object.status;
      if (status == "waiting_for_capture") {
          // Сюда попадаем, если клиент оплатил
          await confirmPayment(payment_id);
          await getPayment(payment_id);
      }
  }
  response.send("OK");
})