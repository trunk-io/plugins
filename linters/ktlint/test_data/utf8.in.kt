package demo

fun main(args: Array<String>) {
    println(
        """
        ┌───────────┬───────────┬────────────┐
        │   BLOCK   │   FORM    │ ADDED_DATE │
        ├───────────┼───────────┼────────────┤
        │ 1.1.1.1/1 │ trunca…   │ 1111-01-01 │
        │ 2.2.2.2/2 │ OtherForm │ 1212-12-12 │
        └───────────┴───────────┴────────────┘
        """.trimIndent()
    )
}
