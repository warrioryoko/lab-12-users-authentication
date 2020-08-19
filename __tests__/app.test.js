require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  let token;

  const testTodo = {
    todo: 'eat a sandwich',
    completed: false,
  };

  const expected = [
    {
      id: 6,
      todo: 'eat a sandwich',
      completed: false,
      user_id: 2,
    }
  ];

  beforeAll(async done => {
    execSync('npm run setup-db');

    client.connect();

    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'iwona@hopkins.com',
        password: 'abcd'
      });

    token = signInData.body.token;
    
    return done();
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns a new todo item when creating a new todo using POST', async(done) => {
    
    const data = await fakeRequest(app)
      .post('/api/todos')
      .send(testTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);

    done();
  });

  test('returns all todos for the user when hitting GET /todos', async(done) => {
    const expected = [
      {
        id: 6,
        todo: 'eat a sandwich',
        completed: false,
        user_id: 2,
      },
    ];

    const data = await fakeRequest(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);
    
    done();
  });

  test('returns a single todo for the user when hitting GET /todos/:id', async(done) => {
    const expected = [
      {
        id: 6,
        todo: 'eat a sandwich',
        completed: false,
        user_id: 2,
      }
    ];

    const data = await fakeRequest(app)
      .get('/api/todos/6')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);

    done();

  });

  test('updates a single todo for the user when hitting PUT /todo/:id', async(done) => {
    const testTodo = {
      id: 6,
      todo: 'ate a sandwich',
      completed: true,
      user_id: 2,
    };

    const expectedAllTodos = [
      {
        id: 6,
        todo: 'ate a sandwich',
        completed: true,
        user_id: 2,
      }
    ];

    const data = await fakeRequest(app)
      .put('/api/todos/6')
      .send(testTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    const allTodos = await fakeRequest(app)
      .get('/api/todos')
      .send(testTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(testTodo);
    expect(allTodos.body).toEqual(expectedAllTodos);
    done();
  });
});
