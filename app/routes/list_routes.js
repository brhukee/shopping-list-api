const express = require('express')

const passport = require('passport')

const router = express.Router()

const List = require('./../models/list')

const customErrors = require('../../lib/custom_errors')

const requireOwnership = customErrors.requireOwnership

const requireToken = passport.authenticate('bearer', { session: false })

const handle404 = require('./../../lib/custom_errors')

const removeBlanks = require('../../lib/remove_blank_fields')

router.get('/lists', requireToken, (req, res, next) => {
  List.find({ owner: req.user.id })
    .then((lists) => {
      res.status(200).json({ lists })
    })
    .catch(next)
})

router.get('/lists/:id', requireToken, (req, res, next) => {
  List.findById(req.params.id)
    .then(handle404)
    .then((list) => {
      res.status(200).json({ list: list.toObject() })
    })
    .catch(next)
})

router.post('/lists', requireToken, (req, res, next) => {
  req.body.owner = req.user._id

  List.create(req.body)
    .then(list => res.status(201).json({ list }))
    .catch(next)
})

router.patch('/lists/:id', requireToken, removeBlanks, (req, res, next) => {
  List.findById(req.params.id)
    .then(handle404)
    .then(list => {
      requireOwnership(req, list)

      return list.updateOne(req.body)
    })
    .then(list => res.json({ list }))
    .catch(next)
})

router.delete('/lists/:id', requireToken, (req, res, next) => {
  List.findById(req.params.id)
    .then(handle404)
    .then((list) => {
      requireOwnership(req, list)

      list.deleteOne()
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

module.exports = router
