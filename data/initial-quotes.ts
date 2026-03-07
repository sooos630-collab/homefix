import type { Quote } from "@/lib/types";

export const initialQuotes: Quote[] = [
  {
    id: "q-1",
    date: new Date().toISOString().split("T")[0],
    client: {
      name: "김철수",
      contact: "010-1234-5678",
      address: "서울시 강남구 역삼동 123-45",
      projectDate: "2026-04-15",
    },
    items: [
      {
        id: "i-1",
        category: "가설/철거",
        description: "전체 철거 및 폐기물 처리",
        quantity: 1,
        unitPrice: 500000,
        laborCost: 1000000,
        amount: 1500000,
        costItems: [
          {
            id: "c-1",
            description: "폐기물 처리비",
            quantity: 1,
            unitPrice: 400000,
            margin: 100000,
            amount: 400000,
          },
        ],
        materialMargin: 100000,
        margin: 100000,
      },
      {
        id: "i-2",
        category: "목공",
        description: "천장 덴조 및 가벽 설치",
        quantity: 1,
        unitPrice: 1200000,
        laborCost: 2000000,
        amount: 3200000,
        costItems: [
          {
            id: "c-2",
            description: "석고보드",
            quantity: 50,
            unitPrice: 4000,
            margin: 400000,
            amount: 200000,
          },
          {
            id: "c-3",
            description: "각재",
            quantity: 30,
            unitPrice: 6000,
            margin: 420000,
            amount: 180000,
          },
        ],
        materialMargin: 820000,
        margin: 820000,
      },
    ],
    subtotal: 4700000,
    tax: 0,
    total: 4700000,
    totalCost: 3780000,
    totalMargin: 920000,
    notes:
      "1. 본 견적서는 발행일로부터 14일간 유효합니다.\n2. 부가세(VAT) 별도 금액입니다.",
    status: "견적",
  },
];
