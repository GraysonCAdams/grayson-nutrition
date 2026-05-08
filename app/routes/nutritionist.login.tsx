import { redirect } from "react-router";

export function loader() {
  throw redirect("/nutritionist");
}

export default function NutritionistLogin() {
  return null;
}
