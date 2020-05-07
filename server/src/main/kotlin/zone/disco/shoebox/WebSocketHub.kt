package zone.disco.shoebox

import io.javalin.websocket.*
import org.eclipse.jetty.websocket.api.CloseStatus
import zone.disco.shoebox.messages.ServerMessage
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class WebSocketHub(private val mainService: MainService) {
    private val ctxUserIdMap = ConcurrentHashMap<String, WsContext>()

    fun register(ws: WsHandler) {
        ws.onConnect(::onConnect)
        ws.onMessage(::onMessage)
        ws.onError(::onError)
        ws.onClose(::onClose)
    }

    private fun onConnect(ctx: WsConnectContext) {
        val userId = UUID.randomUUID().toString()
        ctx.attribute("userId", userId)
        ctxUserIdMap[userId] = ctx

        val roomId = ctx.queryParam<String>("room").get()
        val userName = ctx.queryParam<String>("userName").get()
        val peerId = ctx.queryParam<String>("peerId").get()

        mainService.userConnected(userId = userId, userName = userName, peerId = peerId, roomId = roomId)
    }

    private fun onMessage(ctx: WsMessageContext) {
        val userId = ctx.attribute<String>("userId") ?: throw Error("missing user id on ctx")
        val message = ctx.message()
        mainService.handleMessage(userId, message)
    }

    private fun onError(ctx: WsErrorContext) {
        val userId = ctx.attribute<String>("userId") ?: return
        ctxUserIdMap.remove(userId)
        mainService.userDisconnected(userId)
    }

    private fun onClose(ctx: WsCloseContext) {
        val userId = ctx.attribute<String>("userId") ?: return
        ctxUserIdMap.remove(userId)
        mainService.userDisconnected(userId)
    }

    fun sendMessage(userId: String, message: ServerMessage) {
        val ctx = ctxUserIdMap[userId] ?: throw Error("no ws ctx found for ID $userId")
        ctx.send(message)
    }

    fun requestClose(userId: String, didError: Boolean) {
        val ctx = ctxUserIdMap[userId] ?: throw Error("no ws ctx found for ID $userId")
        if (didError) {
            ctx.session.close(CloseStatus(1011, "internal server error"))
        } else {
            ctx.session.close(CloseStatus(1000, "requested close"))
        }
    }
}
