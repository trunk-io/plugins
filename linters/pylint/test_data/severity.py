
# This should only raise a diagnostic because of .pylintrc,
# and it should have a level of INFO, which must be correctly parsed.
# 2:[bad-inline-option]
# pylint: disable line-too-long

def foo():
    return "bar"
