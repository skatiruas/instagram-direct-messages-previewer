export interface Mesage<Type extends string, Payload = undefined> {
  type: Type;
  payload: Payload;
}
