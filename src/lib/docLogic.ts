export function isMyDocument(meUserId: number | null, docUserId: number) {
  return meUserId !== null && meUserId === docUserId;
}
