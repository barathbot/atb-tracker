from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import secrets
import json

from users.models import Member
from .models import AuthToken

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Handle Google authentication for both signup and login
    """
    try:
        data = json.loads(request.body)
        firebase_uid = data.get('firebase_uid')
        email = data.get('email')
        name = data.get('name')
        picture = data.get('picture')
        mode = data.get('mode')  # 'signup' or 'login'
        email_verified = data.get('email_verified', False)

        if not all([firebase_uid, email, name]):
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists by firebase_uid or email
        user = None
        try:
            user = Member.objects.get(firebase_uid=firebase_uid)
        except Member.DoesNotExist:
            try:
                user = Member.objects.get(email=email)
                # If user exists but doesn't have firebase_uid, update it
                if not user.firebase_uid:
                    user.firebase_uid = firebase_uid
                    user.provider = 'google'
                    user.email_verified = email_verified
                    if picture:
                        user.picture = picture
                    user.save()
            except Member.DoesNotExist:
                if mode == 'login':
                    return Response(
                        {'error': 'User not found. Please sign up first.'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                # Create new user for signup
                user = Member.objects.create(
                    name=name,
                    email=email,
                    firebase_uid=firebase_uid,
                    picture=picture,
                    provider='google',
                    email_verified=email_verified
                )

        # Update user information if needed
        if user.name != name or user.picture != picture:
            user.name = name
            if picture:
                user.picture = picture
            user.email_verified = email_verified
            user.save()

        # Generate authentication token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=30)  # Token expires in 30 days

        # Create or update auth token
        auth_token, created = AuthToken.objects.get_or_create(
            user=user,
            defaults={
                'token': token,
                'expires_at': expires_at
            }
        )

        if not created:
            # Update existing token
            auth_token.token = token
            auth_token.expires_at = expires_at
            auth_token.is_active = True
            auth_token.save()

        # Prepare user data for response
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'picture': user.picture,
            'provider': user.provider,
            'email_verified': user.email_verified,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }

        return Response({
            'user': user_data,
            'token': token,
            'message': f"User {'registered' if mode == 'signup' else 'logged in'} successfully"
        }, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON data'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
    """Verify authentication token with enhanced checks"""
    try:
        data = json.loads(request.body)
        token = data.get('token')
        print("Token received for verification:", token)

        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            auth_token = AuthToken.objects.get(
                token=token,
                is_active=True,
                expires_at__gt=timezone.now()
            )
            
            # Add user status validation
            if not auth_token.user.is_active:
                return Response(
                    {'error': 'User account is inactive'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user_data = {
                'id': auth_token.user.id,
                'name': auth_token.user.name,
                'email': auth_token.user.email,
                'picture': auth_token.user.picture,
                'provider': auth_token.user.provider,
                'email_verified': auth_token.user.email_verified,
                'is_active': auth_token.user.is_active,  # Include status
                'created_at': auth_token.user.created_at.isoformat() if auth_token.user.created_at else None
            }

            return Response({
                'user': user_data,
                'valid': True
            }, status=status.HTTP_200_OK)

        except AuthToken.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON data'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Logout user by deactivating token
    """
    try:
        data = json.loads(request.body)
        token = data.get('token')

        if not token:
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            auth_token = AuthToken.objects.get(token=token)
            auth_token.is_active = False
            auth_token.save()

            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)

        except AuthToken.DoesNotExist:
            return Response(
                {'error': 'Token not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON data'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user with email and password
    """
    try:
        data = json.loads(request.body)
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if Member.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        user = Member(name=name, email=email, provider='email')
        user.set_password(password)
        user.save()

        # Generate authentication token
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=30)
        AuthToken.objects.create(user=user, token=token, expires_at=expires_at)

        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'provider': user.provider,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }

        return Response({'user': user_data, 'token': token, 'message': 'Registration successful.'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user with email and password"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return Response({'error': 'Email and password are required.'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            user = Member.objects.get(email=email, provider='email')
            if not user.is_active:  # Add active check
                return Response({'error': 'Account is inactive'},
                              status=status.HTTP_401_UNAUTHORIZED)
                
            if not user.check_password(password):
                return Response({'error': 'Invalid password.'},
                              status=status.HTTP_401_UNAUTHORIZED)

            # Generate authentication token
            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(days=30)
            AuthToken.objects.update_or_create(
                user=user, 
                defaults={
                    'token': token, 
                    'expires_at': expires_at, 
                    'is_active': True
                }
            )

            user_data = {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'provider': user.provider,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }

            return Response({
                'user': user_data, 
                'token': token, 
                'message': 'Login successful.'
            }, status=status.HTTP_200_OK)

        except Member.DoesNotExist:
            return Response({'error': 'User not found.'},
                          status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({'error': str(e)},
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

        
