@file:Suppress("unused", "UNUSED_PARAMETER")

package cases

fun constantInt(): Int {
    return 42
}

open class BrokenHashCode {
    override fun hashCode() = 1
}

fun badWhitespace() {
  val i = 1
  if (i > 0) {
      if (i < 5) {
          println(i)
      }
  }


    return
  91
    }
