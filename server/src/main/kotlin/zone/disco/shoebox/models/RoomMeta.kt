package zone.disco.shoebox.models

data class RoomMeta(val roomId: String, val environment: String) {
    var hostId: String? = null
}