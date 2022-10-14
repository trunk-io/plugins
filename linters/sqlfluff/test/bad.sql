SELECT
   col_a,
   col_b,
   COUNT(*) as num,
            SUM(num) OVER (
      PARTITION BY col_a
      ORDER BY col_b
   ) as an_aggregate_function
    FROM tbl_a
GROUP BY 1, 2
