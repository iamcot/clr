import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/format/csv'

describe('toCsv', () => {
  it('thêm BOM, tiêu đề và xuống dòng CRLF', () => {
    expect(toCsv(['A', 'B'], [['x', 1]])).toBe('﻿A,B\r\nx,1')
  })

  it('bao nháy kép khi có dấu phẩy hoặc nháy', () => {
    expect(toCsv(['A'], [['a,"b"']])).toBe('﻿A\r\n"a,""b"""')
  })

  it('chặn công thức và để trống ô null', () => {
    expect(toCsv(['A', 'B'], [['=1+1', null]])).toBe("﻿A,B\r\n'=1+1,")
  })
})
