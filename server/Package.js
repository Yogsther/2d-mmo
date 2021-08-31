class Package {
    constructor(identifier, content) {
        this.identifier = identifier;
        this.content = content;
    }
    ToString() {
        return JSON.stringify(this);
    }
}

module.exports = Package;