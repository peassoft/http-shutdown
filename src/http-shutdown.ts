import type { Server as HttpServer } from 'node:http';
import type { Http2Server, Http2SecureServer } from 'node:http2';
import type { Server as HttpsServer } from 'node:https';
import { Server as TlsServer } from 'node:tls';
import type { Duplex } from 'node:stream';

/**
 * HTTP server.
 *
 * @public
 */
export type Server = HttpServer | Http2Server | Http2SecureServer | HttpsServer;

/**
 * `HttpShutdown` class constructor options.
 *
 * @public
 */
export type HttpShutdownOptions = {
  /**
   * Timeout in milliseconds after which .... for Optional. Defaults to `30_000`.
   */
  timeoutMs?: number;
};

export class HttpShutdown {
  #options: Required<HttpShutdownOptions>;
  #server: Server;

  // TODO ????
  #isTlsServer: boolean;

  // We cannot aquier sockets from the `connection` event on a `TlsServer` as such sockets will
  // not receive events unlike sockets created from the `net.Server` 'connection' event
  // (see https://nodejs.org/docs/latest-v24.x/api/tls.html#event-connection).
  // But we need to listen to the `close` event in order to remove the socket from the store.
  #connectionEventName: 'connection' | 'secureConnection';

  #sockets = new Set<Duplex>();

  #isShuttingDown = false;

  constructor(server: Server, options: HttpShutdownOptions) {
    const {
      timeoutMs = 30_000,
    } = options;

    this.#options = {
      timeoutMs,
    };

    // `Http2SecureServer` and `HttpsServer` are subclasses of `tls.TlsServer`
    if (server instanceof TlsServer) {
      this.#isTlsServer = true;
      this.#connectionEventName = 'connection';
    } else {
      this.#isTlsServer = false;
      this.#connectionEventName = 'secureConnection';
    }

    server.addListener(this.#connectionEventName, (socket: Duplex) => {
      if (this.#isShuttingDown) {
        socket.destroy();
      } else {
        this.#sockets.add(socket);

        socket.once('close', () => {
            this.#sockets.delete(socket);
        });
      }
    });

    this.#server = server;
  }

  #destroySocket(socket: Duplex): void {
    socket.destroy();
    this.#sockets.delete(socket);
  }

  // shutdown(): Promise<void> {
  //   if (this.#isShuttingDown) {
  //     return Promise.resolve();
  //   }

  //   this.#isShuttingDown = true;
  // }
}
