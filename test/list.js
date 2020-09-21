process.env.TESTENV = true

let List = require('../app/models/list.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let listId

describe('Lists', () => {
  const listParams = {
    title: '13 JavaScript tricks SEI instructors don\'t want you to know',
    text: 'You won\'believe number 8!'
  }

  before(done => {
    List.deleteMany({})
      .then(() => User.create({
        email: 'caleb',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => List.create(Object.assign(listParams, {owner: userId})))
      .then(record => {
        listId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /lists', () => {
    it('should get all the lists', done => {
      chai.request(server)
        .get('/lists')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.lists.should.be.a('array')
          res.body.lists.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /lists/:id', () => {
    it('should get one list', done => {
      chai.request(server)
        .get('/lists/' + listId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.list.should.be.a('object')
          res.body.list.title.should.eql(listParams.title)
          done()
        })
    })
  })

  describe('DELETE /lists/:id', () => {
    let listId

    before(done => {
      List.create(Object.assign(listParams, { owner: userId }))
        .then(record => {
          listId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .delete('/lists/' + listId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server)
        .delete('/lists/' + listId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server)
        .delete('/lists/' + listId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /lists', () => {
    it('should not POST an list without a title', done => {
      let noTitle = {
        text: 'Untitled',
        owner: 'fakedID'
      }
      chai.request(server)
        .post('/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ list: noTitle })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an list without text', done => {
      let noText = {
        title: 'Not a very good list, is it?',
        owner: 'fakeID'
      }
      chai.request(server)
        .post('/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ list: noText })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server)
        .post('/lists')
        .send({ list: listParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an list with the correct params', done => {
      let validList = {
        title: 'I ran a shell command. You won\'t believe what happened next!',
        text: 'it was rm -rf / --no-preserve-root'
      }
      chai.request(server)
        .post('/lists')
        .set('Authorization', `Bearer ${token}`)
        .send({ list: validList })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('list')
          res.body.list.should.have.property('title')
          res.body.list.title.should.eql(validList.title)
          done()
        })
    })
  })

  describe('PATCH /lists/:id', () => {
    let listId

    const fields = {
      title: 'Find out which HTTP status code is your spirit animal',
      text: 'Take this 4 question quiz to find out!'
    }

    before(async function () {
      const record = await List.create(Object.assign(listParams, { owner: userId }))
      listId = record._id
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .patch('/lists/' + listId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ list: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server)
        .patch(`/lists/${listId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ list: fields })
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server)
        .get(`/lists/${listId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.list.title.should.eql(fields.title)
          res.body.list.text.should.eql(fields.text)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server)
        .patch(`/lists/${listId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ list: { text: '' } })
        .then(() => {
          chai.request(server)
            .get(`/lists/${listId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.statList
              res.body.should.be.a('object')
              // console.log(res.body.list.text)
              res.body.list.title.should.eql(fields.title)
              res.body.list.text.should.eql(fields.text)
              done()
            })
        })
    })
  })
})
