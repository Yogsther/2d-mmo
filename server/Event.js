class Event {
    constructor(identifier, value) {
        this.identifier = identifier;
        this.value = value;
        this.floats = {}
        this.strings = {}
    }
}

module.exports = Event;