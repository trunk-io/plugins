from typing import Callable, Iterator, Union, Optional, Enum


def wrong_type(x: int) -> str:
    return x  # error: Incompatible return value type (got "int", expected "str")

class A:
    def method1(self) -> None:
        self.x = 1

    def method2(self) -> None:
        self.x = ""

a = A()
reveal_type(a.x)

a.x = ""
a.x = 3.0



class A:
    x: int = 0 # Regular class variable
    y: ClassVar[int] = 0 # Pure class variable

    def __init__(self):
        self.z = 0 # Pure instance variable

print(A.x)
print(A.y)
print(A.z)



class Color(Enum):
    RED = 1
    BLUE = 2

def is_red(color: Color) -> bool:
    if color == Color.RED:
        return True
    elif color == Color.BLUE:
        return False


def func(val: int | None):
    if val is not None:

        def inner_1() -> None:
            reveal_type(val)
            print(val + 1)

        inner_2 = lambda: reveal_type(val) + 1

        inner_1()
        inner_2()
