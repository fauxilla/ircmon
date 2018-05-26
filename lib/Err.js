export default class CheckError extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}
