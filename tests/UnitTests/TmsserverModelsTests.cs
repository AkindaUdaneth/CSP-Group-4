using NUnit.Framework;
using tmsserver.Models;

namespace UnitTests;

public class TmsserverModelsTests
{
    [Test]
    public void LoginModel_Has_Default_Empty_Credentials()
    {
        var model = new LoginModel();
        Assert.Multiple(() =>
        {
            Assert.That(model.Username, Is.EqualTo(string.Empty));
            Assert.That(model.Password, Is.EqualTo(string.Empty));
        });
    }
}
