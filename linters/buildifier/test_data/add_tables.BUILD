foo_macro(
    fizz = [
        ":lib2",
        ":lib1",
    ],
)

filegroup(
    name = "files",
        srcs = glob(["**"]),
)

sh_library(
    name = "lib1",
    srcs = ["src1.sh"],
)

sh_library(
    name = "lib2",
    srcs = ["src1.sh"],
)

sh_binary(
    name = "foo",
    srcs = ["foo.sh"],
    deps = [
        ":lib2",
            ":lib1",
    ],
)
