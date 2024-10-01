from django.db import models

class Link(models.Model):
    link = models.CharField(max_length=255, null=True)

    class Meta:
        verbose_name = "Link"
        verbose_name_plural = "Links"

    def __str__(self):
        return self.link

    def get_absolute_url(self):
        return reverse("link_detail", kwargs={"pk": self.pk})
