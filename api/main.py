# import signal
# import faulthandler
#
# faulthandler.register(signal.SIGUSR1)


import uvicorn
import asyncio
import logging
from utils.logger import LoggerBase as lg


class IgnoreCancelledErrorFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if record.exc_info:
            exc_type, _, _ = record.exc_info

            if exc_type is asyncio.CancelledError:
                return False

        return True


class ImmediateCancelServer(uvicorn.Server):
    def __init__(self, config):
        super().__init__(config)

        # Ignore asyncio.CancelledError logs
        logging.getLogger("uvicorn.error").addFilter(IgnoreCancelledErrorFilter())

    async def shutdown(self, sockets=None):
        lg.info("Connection shutdown initiated...")

        # Stop accepting new connections
        lg.info("Stop receiving new connections...")
        for server in self.servers:
            server.close()
        for sock in sockets or []:
            sock.close()  # pragma: full coverage

        # Immediately cancel running ASGI tasks
        tasks = list(self.server_state.tasks)
        lg.info(f"Canceling {len(tasks)} running ASGI task(s)...")

        for task in tasks:
            task.cancel(msg="system")

        # Wait for their cancellation cleanup
        if tasks:
            await asyncio.gather(
                *tasks,
                return_exceptions=True,
            )

        # Request shutdown on all existing connections.
        lg.info("Closing all connections...")
        for connection in list(self.server_state.connections):
            connection.shutdown()

        for server in self.servers:
            await server.wait_closed()

        # Send the lifespan shutdown event, and wait for application shutdown.
        if not self.force_exit:
            await self.lifespan.shutdown()


config = uvicorn.Config(
    "app:app",
    host="0.0.0.0",
    port=38889,
    loop="asyncio",
)
server = ImmediateCancelServer(config)

try:
    server.run()
except (KeyboardInterrupt, asyncio.CancelledError):
    pass
