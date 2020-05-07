package zone.disco.shoebox

import com.fasterxml.jackson.databind.exc.InvalidTypeIdException
import io.javalin.Javalin
import io.javalin.http.BadRequestResponse
import io.javalin.plugin.json.JavalinJson
import zone.disco.shoebox.messages.ClientMessage
import zone.disco.shoebox.messages.ServerMessage
import zone.disco.shoebox.models.Position
import zone.disco.shoebox.models.RoomMeta
import zone.disco.shoebox.models.User
import java.util.concurrent.ConcurrentHashMap

class Room(val roomMeta: RoomMeta) {
    val users = ConcurrentHashMap<String, User>()
    val positions = ConcurrentHashMap<String, Position>()
}

class MainService {
    lateinit var hub: WebSocketHub

    private val rooms = ConcurrentHashMap<String, Room>()
    private val userRoomMap = ConcurrentHashMap<String, String>()

    fun createRoom(roomId: String) {
        if (rooms.contains(roomId)) {
            // TODO: should retry here
            throw BadRequestResponse("Room already exists")
        }
        rooms[roomId] = Room(RoomMeta(roomId, "default"))
    }

    fun userConnected(userId: String, userName: String, peerId: String, roomId: String) {
        val room = rooms[roomId]

        if (room == null) {
            hub.sendMessage(userId, ServerMessage.Error("could not find room with ID $roomId"))
            hub.requestClose(userId, false)
            return
        }

        val user = User(userName, peerId = peerId, avatar = "default.png")
        val position = Position(0, 0)
        room.users[userId] = user
        room.positions[userId] = position
        userRoomMap[userId] = roomId

        // the first user to join a room is the host
        if (room.users.size == 1) {
            room.roomMeta.hostId = userId
        }

        hub.sendMessage(
            userId,
            ServerMessage.Identity(
                userId = userId
            )
        )

        hub.sendMessage(
            userId,
            ServerMessage.Sync(
                room = room.roomMeta,
                users = room.users.toMap(),
                positions = room.positions.toMap()
            )
        )

        sendToRoom(roomId, ServerMessage.Joined(userId, user, position))
    }

    fun userDisconnected(userId: String) {
        // TODO: should these log?
        val roomId = userRoomMap[userId] ?: return
        val room = rooms[roomId] ?: return

        room.users.remove(userId)
        room.positions.remove(userId)
        userRoomMap.remove(userId)

        sendToRoom(roomId, ServerMessage.Left(userId))
    }

    fun handleMessage(userId: String, messageStr: String) {
        val message = try {
            JavalinJson.fromJson(messageStr, ClientMessage::class.java)
        } catch (e: InvalidTypeIdException) {
            Javalin.log.error(e.toString())
            sendError(userId, "unrecognized message type ${e.typeId}")
            return
        } catch (e: Exception) {
            Javalin.log.error(e.toString())
            sendError(userId, "could not deserialize message")
            return
        }

        when (message) {
            is ClientMessage.Chat -> handleChatMessage(userId, message)
            is ClientMessage.Move -> handleMoveMessage(userId, message)
        }
    }

    private fun handleMoveMessage(userId: String, message: ClientMessage.Move) {
        val roomId = userRoomMap[userId] ?: return sendError(userId, "no room found for user $userId")
        val room = rooms[roomId] ?: throw Error("could not find room $roomId")
        val position =
            room.positions[userId] ?: throw Error("could not find position for user $userId and room $roomId")
        position.x = message.x
        position.y = message.y
        sendToRoom(roomId, ServerMessage.Move(userId, position))
    }

    private fun handleChatMessage(userId: String, message: ClientMessage.Chat) {
        val roomId = userRoomMap[userId] ?: return sendError(userId, "no room found for user $userId")
        sendToRoom(roomId, ServerMessage.Chat(userId, message.message))
    }

    private fun sendToRoom(roomId: String, message: ServerMessage) {
        val room = rooms[roomId] ?: throw Error("could not find room $roomId")

        val userIds = room.users.keys()

        for (userId in userIds) {
            hub.sendMessage(userId, message)
        }
    }

    private fun sendError(userId: String, message: String) {
        hub.sendMessage(userId, ServerMessage.Error(message))
    }
}
