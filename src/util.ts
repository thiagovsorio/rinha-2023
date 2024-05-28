import type { Person } from "./database";

function isValidDate(date: string) {
  let [year, month, day]: string[] = date.split("-");
  let [yearN, monthN, dayN]: number[] = [
    Number(year),
    Number(month),
    Number(day),
  ];
  var d = new Date(yearN, monthN - 1, dayN);

  const nascimentoDate = new Date(date);

  return (
    d &&
    d.getMonth() + 1 == monthN &&
    d.getDate() == dayN &&
    nascimentoDate.getTime() === nascimentoDate.getTime()
  );
}

export const validatePerson = (person: Person) => {
  const { apelido, nome, nascimento, stack } = person;

  if (!apelido || !nome || !nascimento) {
    return new Response("Nome, apelido e nascimento são obrigatórios", {
      status: 400,
    });
  }

  if (typeof apelido !== "string" || apelido.length > 32 || typeof nome !== "string" || nome.length > 100 ||
  typeof nascimento !== "string" || !isValidDate(nascimento) ||
  (stack && !Array.isArray(stack)) ||
    (stack &&
      Array.isArray(stack) &&
      stack.some((s: any) => typeof s !== "string"))

  ) {
    return new Response("Campos inválidos", { status: 400 });
  }

  return;
};
