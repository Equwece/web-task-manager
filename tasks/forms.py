from django import forms


class LoginForm(forms.Form):
    username = forms.CharField(
        label='Username', max_length=100, widget=forms.TextInput(attrs={
            'class': 'inputForm',
        })
    )

    password = forms.CharField(
        label='Password', max_length=100, widget=forms.PasswordInput(attrs={
            'class': 'inputForm',
        })
    )


class RegisterForm(forms.Form):
    username = forms.CharField(
        label='Username', max_length=100, widget=forms.TextInput(attrs={
            'class': 'inputForm',
        })
    )

    email = forms.CharField(
        label='Email', widget=forms.EmailInput(attrs={
            'class': 'inputForm',
        })
    )

    password = forms.CharField(
        label='Password', max_length=100, widget=forms.PasswordInput(attrs={
            'class': 'inputForm',
        })
    )


class UploadFileForm(forms.Form):
    file = forms.FileField(
        label='Import todo.txt',
    )
