import paymentModel from "../model/paymentModel.js";

// Function to handle successful payment intent

export const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const paymentId = paymentIntent.id;
  const amountReceived = paymentIntent.amount_received;

  try {
    console.log(paymentIntent.metadata, "metadata");
    await paymentModel.updateOne(
      { paymentIntentId: paymentId },
      { paymentStatus: true, totalAmount: amountReceived }
    );

    console.log("Payment and booking details saved successfully");
  } catch (error) {
    console.error("Error occurred while handling payment intent:", error);
  }
};

// Function to handle failed payment intent
export const handlePaymentIntentPaymentFailed = async (paymentIntent) => {
  const paymentId = paymentIntent.id;

  try {
    // Update your payment model's status to 'failed'
    await paymentModel.updateOne(
      { paymentIntentId: paymentId },
      { paymentStatus: false }
    );
    console.log(`Payment ${paymentId} updated to failed`);
  } catch (error) {
    console.error(`Error updating payment ${paymentId}:`, error);
  }
};
