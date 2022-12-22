
def main():
    try:
        pass
    except (Exception, TypeError):
        pass

import sys

# trunk-ignore(flake8/F401): this will trigger a warning to verify that the config is applied
class NoDocstring(object):
    def __init__(self, arg1):
        self._attr1 = arg1

class Globe(object):
    def __init__(self):
        self.shape = 'spheroid'


#whitespace below vvv

  #A malindented comment
if __name__ == "__main__" :
      a=4+1
      b=( 2*7 )
      c = [1,
           2,
           3
      ]
      print(a/b)
