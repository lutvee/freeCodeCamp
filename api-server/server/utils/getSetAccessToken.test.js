/* global describe it expect */
import {
  getAccessTokenFromRequest,
  errorTypes,
  setAccessTokenToResponse,
  removeCookies
} from './getSetAccessToken';
import { mockReq, mockRes } from 'sinon-express-mock';
import jwt from 'jsonwebtoken';

describe('getSetAccessToken', () => {
  const validJWTSecret = 'this is a super secret string';
  const invalidJWTSecret = 'This is not correct secret';
  const now = new Date(Date.now());
  const theBeginningOfTime = new Date(0);
  const accessToken = {
    id: '123abc',
    userId: '456def',
    ttl: 60000,
    created: now
  };

  describe('getAccessTokenFromRequest', () => {
    it('return `no token` error if no token is found', () => {
      const req = mockReq({ headers: {}, cookie: {} });
      const result = getAccessTokenFromRequest(req, validJWTSecret);
      expect(result.error).toEqual(errorTypes.noTokenFound);
    });

    describe('cookies', () => {
      it('returns `invalid token` error for malformed tokens', () => {
        const invalidJWT = jwt.sign({ accessToken }, invalidJWTSecret);
        // eslint-disable-next-line camelcase
        const req = mockReq({ cookie: { jwt_access_token: invalidJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.error).toEqual(errorTypes.invalidToken);
      });

      it('returns `expired token` error for expired tokens', () => {
        const invalidJWT = jwt.sign(
          { accessToken: { ...accessToken, created: theBeginningOfTime } },
          validJWTSecret
        );
        // eslint-disable-next-line camelcase
        const req = mockReq({ cookie: { jwt_access_token: invalidJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.error).toEqual(errorTypes.expiredToken);
      });

      it('returns a valid access token with no errors ', () => {
        expect.assertions(2);
        const validJWT = jwt.sign({ accessToken }, validJWTSecret);
        // eslint-disable-next-line camelcase
        const req = mockReq({ cookie: { jwt_access_token: validJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.error).toBeFalsy();
        expect(result.accessToken).toEqual({
          ...accessToken,
          created: accessToken.created.toISOString()
        });
      });

      it('returns the signed jwt if found', () => {
        const validJWT = jwt.sign({ accessToken }, validJWTSecret);
        // eslint-disable-next-line camelcase
        const req = mockReq({ cookie: { jwt_access_token: validJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.jwt).toEqual(validJWT);
      });
    });

    describe('Auth headers', () => {
      it('returns `invalid token` error for malformed tokens', () => {
        const invalidJWT = jwt.sign({ accessToken }, invalidJWTSecret);
        // eslint-disable-next-line camelcase
        const req = mockReq({ headers: { 'X-fcc-access-token': invalidJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.error).toEqual(errorTypes.invalidToken);
      });

      it('returns `expired token` error for expired tokens', () => {
        const invalidJWT = jwt.sign(
          { accessToken: { ...accessToken, created: theBeginningOfTime } },
          validJWTSecret
        );
        // eslint-disable-next-line camelcase
        const req = mockReq({ headers: { 'X-fcc-access-token': invalidJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.error).toEqual(errorTypes.expiredToken);
      });

      it('returns a valid access token with no errors ', () => {
        expect.assertions(2);
        const validJWT = jwt.sign({ accessToken }, validJWTSecret);
        // eslint-disable-next-line camelcase
        const req = mockReq({ headers: { 'X-fcc-access-token': validJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.error).toBeFalsy();
        expect(result.accessToken).toEqual({
          ...accessToken,
          created: accessToken.created.toISOString()
        });
      });

      it('returns the signed jwt if found', () => {
        const validJWT = jwt.sign({ accessToken }, validJWTSecret);
        // eslint-disable-next-line camelcase
        const req = mockReq({ headers: { 'X-fcc-access-token': validJWT } });
        const result = getAccessTokenFromRequest(req, validJWTSecret);

        expect(result.jwt).toEqual(validJWT);
      });
    });
  });

  describe('setAccessTokenToResponse', () => {
    it('sets three cookies in the response', () => {
      expect.assertions(3);
      const req = mockReq();
      const res = mockRes();

      const expectedJWT = jwt.sign({ accessToken }, validJWTSecret);

      setAccessTokenToResponse({ accessToken }, req, res, validJWTSecret);

      expect(res.cookie.getCall(0).args).toEqual([
        'jwt_access_token',
        expectedJWT,
        {
          signed: false,
          domain: 'localhost',
          maxAge: accessToken.ttl
        }
      ]);
      expect(res.cookie.getCall(1).args).toEqual([
        'access_token',
        accessToken.id,
        {
          signed: false,
          domain: 'localhost',
          maxAge: accessToken.ttl
        }
      ]);
      expect(res.cookie.getCall(2).args).toEqual([
        'userId',
        accessToken.userId,
        {
          signed: false,
          domain: 'localhost',
          maxAge: accessToken.ttl
        }
      ]);
    });
  });

  describe('removeCookies', () => {
    it('removes four cookies set in the lifetime of an authenticated session', () => {
      // expect.assertions(4);
      const req = mockReq();
      const res = mockRes();

      removeCookies(req, res);

      expect(res.clearCookie.getCall(0).args).toEqual([
        'jwt_access_token',
        {
          signed: false,
          domain: 'localhost'
        }
      ]);
      expect(res.clearCookie.getCall(1).args).toEqual([
        'access_token',
        {
          signed: false,
          domain: 'localhost'
        }
      ]);
      expect(res.clearCookie.getCall(2).args).toEqual([
        'userId',
        {
          signed: false,
          domain: 'localhost'
        }
      ]);
      expect(res.clearCookie.getCall(3).args).toEqual([
        '_csrf',
        {
          signed: false,
          domain: 'localhost'
        }
      ]);
    });
  });
});
