load("@foo//:test.bzl", "a")
load("@bar//:test.bzl", "b")

# Misformatted file
def eponymous_name():
    name = native.package_name()





    return name[name.rfind("/") + 1:]
