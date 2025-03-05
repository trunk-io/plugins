from typing import Callable, Iterator, Union, Optional, Enum
# Create import cycle by importing from a module that will import this module
from circular_dependency import some_function

def wrong_type(x: int) -> str:
    return x  # error: Incompatible return value type (got "int", expected "str")

# Export something for the circular module to import
def function_for_circular_import():
    return "This function will be imported in circular_dependency.py"

class A:
    def method1(self) -> None:
        self.x = 1

    def method2(self) -> None:
        self.x = "" # Mypy treats this as an error because `x` is implicitly declared as `int`

a = A()
reveal_type(a.x)

a.x = "" # Basedpyright allows this because the type of `x` is `int | str`
a.x = 3.0 # Basedpyright treats this as an error because the type of `x` is `int | str`



class A:
    x: int = 0 # Regular class variable
    y: ClassVar[int] = 0 # Pure class variable

    def __init__(self):
        self.z = 0 # Pure instance variable

print(A.x)
print(A.y)
print(A.z) # basedpyright shows error, mypy shows no error



class Color(Enum):
    RED = 1
    BLUE = 2

def is_red(color: Color) -> bool:
    if color == Color.RED:
        return True
    elif color == Color.BLUE:
        return False
    # mypy reports error: Missing return statement


def func(val: int | None):
    if val is not None:

        def inner_1() -> None:
            reveal_type(val)
            print(val + 1)  # mypy produces a false positive error here

        inner_2 = lambda: reveal_type(val) + 1

        inner_1()
        inner_2()
