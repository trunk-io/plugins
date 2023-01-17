from dataclasses import dataclass

@dataclass
class Bar:
  a: int
  b: int

def bad_function() -> int:
  print("returns nothing")
