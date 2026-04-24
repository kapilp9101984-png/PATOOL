using PDFDocumentAnalyser.Service;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Add services to the container.
builder.Services.AddHttpClient<PageIndexService>(client =>
{
    client.DefaultRequestHeaders.Add("api_key",
        builder.Configuration["PageIndex:ApiKey"]);
});

builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseAuthorization();

app.MapControllers();
app.UseCors(); // Add this line before app.Run()


app.Run();
