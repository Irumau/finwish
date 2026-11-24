import type { FastifyInstance } from "fastify";
import { pool } from "@finwish/database";


import { z} from "zod";

export default async function userRoutes(app: FastifyInstance) {
  app.get("users", async (_request, reply) => {

    return { status: "ok", users: []};
  });


  // se obtiene un unico usuario mediante el id
  app.get("users/:id", async (request, reply)=>{
    const {id} = request.params as {id:number};
    
    // validacion de id


  })


  const querySchema = z.object({
    name: z.string().min(2).optional()
  })
  app.get("users/hello", async(_request, reply)=>{
    
    const result = querySchema.safeParse(_request.query);
    if(!result.success){
        return reply.code(400).send({details: result.error.issues});

    }


    const {name} = result.data;
    return {message: `Hello ${name ?? "world"}`};
  })
}
