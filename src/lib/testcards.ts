// Sandbox test cards. Any future expiry date and any 3-digit CVV work.
// Real card numbers are rejected — never type a real card into a sandbox.

export type CardOutcome = {
  number: string;
  brand: "VISA" | "MASTERCARD";
  label: string;
  result: "approved" | "declined";
  threeDS: boolean;
  dispute?: boolean;
  responseCode: string;
  responseDescription: string;
};

export const THREE_DS_CODE = "1234";

export const TEST_CARDS: CardOutcome[] = [
  {
    number: "4242424242424242",
    brand: "VISA",
    label: "Approved",
    result: "approved",
    threeDS: false,
    responseCode: "00",
    responseDescription: "Approved",
  },
  {
    number: "5555555555554444",
    brand: "MASTERCARD",
    label: "Approved",
    result: "approved",
    threeDS: false,
    responseCode: "00",
    responseDescription: "Approved",
  },
  {
    number: "4000002760003184",
    brand: "VISA",
    label: "Approved after 3-D Secure (code 1234)",
    result: "approved",
    threeDS: true,
    responseCode: "00",
    responseDescription: "Approved",
  },
  {
    number: "4000000000000002",
    brand: "VISA",
    label: "Declined — do not honor",
    result: "declined",
    threeDS: false,
    responseCode: "05",
    responseDescription: "Do not honor",
  },
  {
    number: "4000000000009995",
    brand: "VISA",
    label: "Declined — insufficient funds",
    result: "declined",
    threeDS: false,
    responseCode: "51",
    responseDescription: "Insufficient funds",
  },
  {
    number: "4000000000000069",
    brand: "VISA",
    label: "Declined — expired card",
    result: "declined",
    threeDS: false,
    responseCode: "54",
    responseDescription: "Expired card",
  },
  {
    number: "4000000000000259",
    brand: "VISA",
    label: "Approved, then the customer opens a dispute",
    result: "approved",
    threeDS: false,
    dispute: true,
    responseCode: "00",
    responseDescription: "Approved",
  },
];

export function luhnValid(num: string): boolean {
  if (!/^\d{12,19}$/.test(num)) return false;
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string): string {
  if (/^4/.test(num)) return "VISA";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(num)) return "MASTERCARD";
  if (/^3[47]/.test(num)) return "AMEX";
  return "CARD";
}

export function findTestCard(num: string): CardOutcome | undefined {
  return TEST_CARDS.find((c) => c.number === num);
}

/** 4242424242424242 → 424242XXXXXX4242 */
export function maskCard(num: string): string {
  return num.slice(0, 6) + "X".repeat(Math.max(0, num.length - 10)) + num.slice(-4);
}

export function formatCardNumber(num: string): string {
  return num.replace(/(\d{4})(?=\d)/g, "$1 ");
}
