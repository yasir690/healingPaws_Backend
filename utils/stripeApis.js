import stripe from "stripe";
const stripeInstance = stripe(process.env.STRIPE_KEY);

//create customer id

export const createCustomer = async (email) => {
  try {
    const customer = await stripeInstance.customers.create({
      email,
    });

    return customer;
  } catch (error) {
    console.error("Error creating customer with card:", error);
    throw error;
  }
};

//create connected account

export const createConnectedAccount = async (email) => {
  try {
    const account = await stripeInstance.accounts.create({
      type: "custom",
      country: "US",
      email,
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
      },
    });
    return account.id;
  } catch (error) {
    console.log("error in creating connected account:" + error.message);
  }
};

//verify connected account

export const verifyConnectedAccount = async (accountId) => {
  try {
    const accountLink = await stripeInstance.accountLinks.create({
      account: accountId,
      refresh_url: "https://api.healingpaws.tech/api/v1/reauth",
      return_url: `https://api.healingpaws.tech/api/v1/success/${accountId}`,
      type: "account_onboarding",
    });
    return accountLink.url;
  } catch (error) {
    throw new Error("Error verifying connected account: " + error.message);
  }
};

//accept terms and condition for external account

export const acceptTermsCondition = async (accountId) => {
  const date = Math.floor(new Date().getTime() / 1000);
  console.log(date);
  const account = await stripeInstance.accounts.update(accountId, {
    tos_acceptance: {
      date,
      ip: "8.8.8.8",
    },
  });
  return account;
};

//get account details

export const getAccountDetail = async (accountId) => {
  const account = await stripeInstance.accounts.retrieve(accountId);
  return account;
};

//create external bank account

export const createExternalBankAccount = async ({
  account_id,
  account_number,
  routing_number,
}) => {
  try {
    let external_account;
    if (routing_number) {
      external_account = {
        external_account: {
          object: "bank_account",
          account_number,
          routing_number,
          country: "US",
          currency: "usd",
        },
      };
    } else {
      external_account = {
        external_account: {
          object: "bank_account",
          account_number,
          country: "US",
          currency: "usd",
        },
      };
    }

    const externalAccount = await stripeInstance.accounts.createExternalAccount(
      account_id,
      external_account
    );
    return externalAccount;
  } catch (error) {
    throw new Error("Failed to create external account: " + error.message);
  }
};

//get external bank account

export const getAllBankDetail = async (accountId) => {
  const externalAccounts = await stripeInstance.accounts.listExternalAccounts(
    accountId,
    {
      object: "bank_account",
    }
  );
  return externalAccounts;
};

//create payout

export const createPayout = async ({ amount, destination, accountId }) => {
  try {
    const payout = await stripeInstance.payouts.create(
      {
        amount,
        currency: "usd",
        destination, // Correctly specify the destination as a bank account
      },
      {
        stripeAccount: accountId,
      }
    );
    return payout;
  } catch (error) {
    throw new Error(error.message);
  }
};

//get balance

export const getBalance = async ({ accountId }) => {
  const balance = await stripeInstance.balance.retrieve({
    stripeAccount: accountId,
  });
  return balance;
};

//get debit and credit transaction

export const getBalanceTransaction = async ({ accountId }) => {
  const balanceTransactions = await stripeInstance.refunds.list({
    stripeAccount: accountId,
  });
  return balanceTransactions;
};

//create payment intent

export const createPaymentIntent = async ({
  amount,
  customer,
  paymentMethodId,
  returnUrl,
}) => {
  try {
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amount,
      currency: "usd",
      customer: customer,
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      // metadata: metadata,
      confirm: false, // Set confirm to false
    });

    // Manually confirm the payment intent with the returnUrl
    const confirmedPaymentIntent = await stripeInstance.paymentIntents.confirm(
      paymentIntent.id,
      { return_url: returnUrl }
    );

    return confirmedPaymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};

//transfer amount into another account

export const transferAmountInAccount = async ({
  amount,
  metadata,
  connectedAccountId,
}) => {
  const transfer = await stripeInstance.transfers.create({
    amount,
    currency: "usd",
    destination: connectedAccountId,
    metadata,
  });

  return transfer;
};

//refund amount

export const refundAmount = async ({ amount, transferId }) => {
  const transferReversal = await stripeInstance.transfers.createReversal(
    transferId,
    {
      amount,
    }
  );

  return transferReversal;
};

//has payment method

export const hasPaymentMethod = async (customerId) => {
  try {
    // List payment methods for the customer
    const paymentMethods = await stripeInstance.paymentMethods.list({
      customer: customerId,
      type: "card", // Specify the type of payment methods you want to retrieve
    });

    console.log(paymentMethods);
    // Check if the customer has any payment methods attached
    return paymentMethods.data.length > 0;
  } catch (error) {
    console.error("Error retrieving payment methods:", error);
    return false; // Return false in case of any error
  }
};
