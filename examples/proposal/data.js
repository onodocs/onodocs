export const sample = {
  client: "Willow & Co", contact: "Morgan Lee", project: "A clearer digital storefront", date: "2026-10-08",
  summary: "We will turn your growing product collection into an approachable online store. The work pairs a clear shopping journey with a flexible visual system your team can maintain.",
  timeline: "Six weeks from kickoff, with a weekly review every Thursday.",
  includeSupport: true,
  studioLead: { name: "Morgan Hale", role: "Studio lead", email: "morgan@northline.example" },
  deliveryLead: { name: "Alex Chen", role: "Delivery lead", email: "alex@northline.example" },
  items: [
    { description: "Discovery & customer journey", quantity: 2, rate: 900 },
    { description: "Storefront design & prototype", quantity: 5, rate: 900 },
    { description: "Design handoff & team workshop", quantity: 1, rate: 900 },
  ],
};

export function proposalData(values) {
  const items = values.items.map(item => ({ ...item, amount: Math.round(item.quantity * Math.round(item.rate * 100)) / 100 }));
  return { ...values, items, total: items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0) / 100 };
}
