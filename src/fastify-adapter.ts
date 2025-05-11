import { FastifyAdapter } from '@nestjs/platform-fastify';

const fastifyAdapter = new FastifyAdapter({
  trustProxy: true,
});

export default fastifyAdapter;
