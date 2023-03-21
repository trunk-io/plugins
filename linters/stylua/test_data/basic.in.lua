local a <const> = 5
local b <close>

  function fact (n)
    if n == 0 then
      return 1
    else
      return n * fact(n-1)
    end
  end

      -- read 10 lines storing them in a table
      a = {}
      for i=1,10 do
        a[i] = io.read()
      end
