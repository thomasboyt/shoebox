package zone.disco.shoebox

import io.javalin.Javalin
import zone.disco.shoebox.util.generateRandomString

private fun createJavalinApp(): Javalin {
    return Javalin.create { config ->
        config.defaultContentType = "application/json"
        config.showJavalinBanner = false
    }
}

private fun wire(app: Javalin) {
    val mainService = MainService()
    val hub = WebSocketHub(mainService)
    mainService.hub = hub

    app.ws("/ws") { conn -> hub.register(conn) }

    app.post("/api/rooms") { ctx ->
        val roomId = generateRandomString(6)
        mainService.createRoom(roomId)
        ctx.json(object {val roomId = roomId})
    }
}

fun main() {
    val app = createJavalinApp()
    val port = System.getenv("port")?.toInt() ?: 4000
    wire(app)
    app.start(port)
}
