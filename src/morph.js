
SVG.Morphable = SVG.invent({
  create: function (stepper) {
    // FIXME: the default stepper does not know about easing
    this._stepper = stepper || new SVG.Ease('-')

    this._from = null
    this._to = null
    this._type = null
    this._context = null
    this._morphObj = null
  },

  extend: {

    from: function (val) {
      if (val == null) {
        return this._from
      }

      this._from = this._set(val)
      return this
    },

    to: function (val) {
      if (val == null) {
        return this._to
      }

      this._to = this._set(val)
      return this
    },

    type: function (type) {
      // getter
      if (type == null) {
        return this._type
      }

      // setter
      this._type = type
      return this
    },

    _set: function (value) {
      if (!this._type) {
        var type = typeof value

        if (type === 'number') {
          this.type(SVG.Number)
        } else if (type === 'string') {
          if (SVG.Color.isColor(value)) {
            this.type(SVG.Color)
          } else if (SVG.regex.delimiter.test(value)) {
            this.type(SVG.regex.pathLetters.test(value)
              ? SVG.PathArray
              : SVG.Array
            )
          } else if (SVG.regex.numberAndUnit.test(value)) {
            this.type(SVG.Number)
          } else {
            this.type(SVG.Morphable.NonMorphable)
          }
        } else if (SVG.MorphableTypes.indexOf(value.constructor) > -1) {
          this.type(value.constructor)
        } else if (Array.isArray(value)) {
          this.type(SVG.Array)
        } else if (type === 'object') {
          this.type(SVG.Morphable.ObjectBag)
        } else {
          this.type(SVG.Morphable.NonMorphable)
        }
      }

      var result = (new this._type(value)).toArray()
      this._morphObj = this._morphObj || new this._type()
      this._context = this._context ||
        Array.apply(null, Array(result.length)).map(Object)
      return result
    },

    stepper: function (stepper) {
      if (stepper == null) return this._stepper
      this._stepper = stepper
      return this
    },

    done: function () {
      var complete = this._context
        .map(this._stepper.done)
        .reduce(function (last, curr) {
          return last && curr
        }, true)
      return complete
    },

    at: function (pos) {
      var _this = this

      return this._morphObj.fromArray(
        this._from.map(function (i, index) {
          return _this._stepper.step(i, _this._to[index], pos, _this._context[index], _this._context)
        })
      )
    }
  }
})

SVG.Morphable.NonMorphable = SVG.invent({
  create: function (val) {
    val = Array.isArray(val) ? val[0] : val
    this.value = val
  },

  extend: {
    valueOf: function () {
      return this.value
    },

    toArray: function () {
      return [this.value]
    }
  }
})

SVG.Morphable.TransformBag = SVG.invent({
  create: function (obj) {
    if (Array.isArray(obj)) {
      obj = {
        scaleX: obj[0],
        scaleY: obj[1],
        shear: obj[2],
        rotate: obj[3],
        translateX: obj[4],
        translateY: obj[5],
        originX: obj[6],
        originY: obj[7]
      }
    }

    Object.assign(this, SVG.Morphable.TransformBag.defaults, obj)
  },

  extend: {
    toArray: function () {
      var v = this

      return [
        v.scaleX,
        v.scaleY,
        v.shear,
        v.rotate,
        v.translateX,
        v.translateY,
        v.originX,
        v.originY
      ]
    }
  }
})

SVG.Morphable.TransformBag.defaults = {
  scaleX: 1,
  scaleY: 1,
  shear: 0,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  originX: 0,
  originY: 0
}

SVG.Morphable.ObjectBag = SVG.invent({
  create: function (objOrArr) {
    this.values = []

    if (Array.isArray(objOrArr)) {
      this.values = objOrArr
      return
    }

    var entries = Object.entries(objOrArr || {}).sort((a, b) => {
      return a[0] - b[0]
    })

    this.values = entries.reduce((last, curr) => last.concat(curr), [])
  },

  extend: {
    valueOf: function () {
      var obj = {}
      var arr = this.values

      for (var i = 0, len = arr.length; i < len; i += 2) {
        obj[arr[i]] = arr[i + 1]
      }

      return obj
    },

    toArray: function () {
      return this.values
    }
  }
})

SVG.MorphableTypes = [
  SVG.Number,
  SVG.Color,
  SVG.Box,
  SVG.Matrix,
  SVG.Array,
  SVG.PointArray,
  SVG.PathArray,
  SVG.Morphable.NonMorphable,
  SVG.Morphable.TransformBag,
  SVG.Morphable.ObjectBag
]

SVG.extend(SVG.MorphableTypes, {
  to: function (val, args) {
    return new SVG.Morphable()
      .type(this.constructor)
      .from(this.valueOf())
      .to(val, args)
  },
  fromArray: function (arr) {
    this.constructor(arr)
    return this
  }
})