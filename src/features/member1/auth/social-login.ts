import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/config/api';

import { AuthApiError, createAppleChallenge, exchangeSocialCode, loginWithApple, type AuthUser } from './auth-api';
import { saveAuthSession } from './session';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'Google' | 'Apple' | 'Facebook';
export type SocialLoginResult =
  | { status: 'success'; provider: SocialProvider; message: string; user: AuthUser }
  | { status: 'cancelled' | 'unavailable' | 'error'; provider: SocialProvider; message: string };

const discovery = { authorizationEndpoint: `${API_BASE_URL}/api/auth/social/authorize` };
export const SOCIAL_CALLBACK_PATH = 'member1_onboarding_personalization/oauth-callback';

export function useSocialLogin() {
  const redirectUri = makeRedirectUri({ scheme: 'fittrackmobileapp', path: SOCIAL_CALLBACK_PATH });
  const [googleRequest, , promptGoogle] = useAuthRequest({
    clientId: 'google', responseType: ResponseType.Code, redirectUri, usePKCE: true,
  }, discovery);
  const [facebookRequest, , promptFacebook] = useAuthRequest({
    clientId: 'facebook', responseType: ResponseType.Code, redirectUri, usePKCE: true,
  }, discovery);

  async function handleSocialLogin(provider: SocialProvider): Promise<SocialLoginResult> {
    if (Platform.OS !== 'web' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return { status: 'unavailable', provider, message: 'Use a FitTrack development build to sign in with social accounts.' };
    }
    if (provider === 'Apple' && Platform.OS !== 'ios') {
      return { status: 'unavailable', provider, message: 'Sign in with Apple is available on supported iOS devices. Please use Google, Facebook, or your SLIIT account.' };
    }

    try {
      let result;
      if (provider === 'Apple') {
        if (!await AppleAuthentication.isAvailableAsync()) {
          return { status: 'unavailable', provider, message: 'Sign in with Apple is unavailable on this device.' };
        }
        const challenge = await createAppleChallenge();
        const credential = await AppleAuthentication.signInAsync({
          nonce: challenge.nonce,
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
        });
        if (!credential.identityToken) throw new Error('Missing Apple identity token.');
        result = await loginWithApple({
          identityToken: credential.identityToken,
          challengeId: challenge.challengeId,
          ...(credential.fullName ? { displayName: AppleAuthentication.formatFullName(credential.fullName) } : {}),
        });
      } else {
        const request = provider === 'Google' ? googleRequest : facebookRequest;
        if (!request?.codeVerifier || !request.url) {
          return { status: 'unavailable', provider, message: 'Sign-in is getting ready. Please try again in a moment.' };
        }
        // Prepared requests open the popup directly from the user's tap.
        const response = await (provider === 'Google' ? promptGoogle() : promptFacebook());
        if (response.type === 'cancel' || response.type === 'dismiss' ||
            (response.type === 'error' && response.params.error === 'access_denied')) {
          return { status: 'cancelled', provider, message: `${provider} sign-in was cancelled.` };
        }
        if (response.type !== 'success' || !response.params.code || response.params.state !== request.state) {
          return { status: 'error', provider, message: `Unable to complete ${provider} sign-in. Check the provider configuration and try again.` };
        }
        result = await exchangeSocialCode(provider === 'Google' ? 'google' : 'facebook', {
          code: response.params.code, codeVerifier: request.codeVerifier, redirectUri,
        });
      }
      await saveAuthSession(result);
      return { status: 'success', provider, message: result.message, user: result.user };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
        return { status: 'cancelled', provider, message: `${provider} sign-in was cancelled.` };
      }
      // Backend errors are sanitized; provider errors can contain tokens.
      return { status: 'error', provider, message: error instanceof AuthApiError ? error.message : `Unable to complete ${provider} sign-in. Please try again.` };
    }
  }

  return { handleSocialLogin };
}
