import {
  dbCountPersons,
  dbFindByApelido,
  dbGetPersonById,
  dbGetPersons,
  dbInsertPerson,
} from "./database";
import { validatePerson } from "./util";

const { nanoid } = require("nanoid");

export const personController = async function (
  req: Request
): Promise<Response> {
  const method = req.method;
  const path = new URL(req.url).pathname;
  const id = getId(path);

  if (path.startsWith("/pessoas")) {
    if (method === "GET" && !id) {
      return await getPerson(req);
    } else if (method === "GET" && !!id) {
      return await getPersonById(id);
    } else if (method === "POST") {
      return await insertPerson(req);
    }
  } else if (method === "GET" && path === "/contagem-pessoas") {
    console.info("counting persons")
    return new Response(String(await countPersons()));
  }

  return Response.json({ message: "Method not allowed" }, { status: 405 });
};

const getPersonById = async function (id: string): Promise<Response> {
  const person = await dbGetPersonById(id);

  if(!person)
  return new Response("Pessoa não encontrada", {
    status: 404,
  });

  return Response.json(person);
};
const getPerson = async function (req: Request): Promise<Response> {
  const url = new URL(req.url);
  const searchable = url.searchParams.get("t") || undefined;

  const persons = await dbGetPersons(searchable);

  return Response.json(persons);
};
const insertPerson = async function (req: Request): Promise<Response> {
  const id = nanoid();
  const body = await req.json();

  const _person = {
    id,
    nome: body.nome,
    apelido: body.apelido,
    nascimento: body.nascimento,
    stack: body.stack,
  };
  const possibleRes = validatePerson(_person);
  if (possibleRes) return possibleRes;

  const personAlreadyExists = await dbFindByApelido(_person.apelido);
  if (personAlreadyExists) {
    return new Response("Pessoa com esse apelido já existe", {
      status: 400,
    });
  }

  const person = await dbInsertPerson(_person);

  return Response.json(person);
};

const countPersons = async function (): Promise<number> {
  return await dbCountPersons();
};

const getId = function (path: string): string | undefined {
  const afterRoute = path.split("/pessoas")[1];
  if (!afterRoute || afterRoute === "/") return;
  else return afterRoute.replaceAll("/", "");

  return;
};
