# en backend/apps/usuarios/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, Profile

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crea un objeto Profile automáticamente cada vez que
    se crea un nuevo CustomUser.
    """
    if created:
        Profile.objects.create(user=instance)

'''@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """
    Guarda el perfil asociado cuando el usuario se guarda.
    """
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        # Esto puede pasar si el usuario fue creado antes de implementar los perfiles
        Profile.objects.create(user=instance)'''