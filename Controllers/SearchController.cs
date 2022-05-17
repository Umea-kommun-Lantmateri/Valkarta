using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Valkarta.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Valkarta.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        public IConfiguration configuration { get; set; }

        public SearchController(IConfiguration config)
        {
            configuration = config;
        }


        public List<Adress> HomeAddress(string query)
        {
            var ads = new AdressSearch(configuration.GetConnectionString("DB"));

            return ads.Search(query);
        }

        public void LogSearch(VisitorLog visitorLog)
        {
            try
            {
                visitorLog.DateVisited = DateTime.Now;
                var tools = new Tools(configuration.GetConnectionString("DB"));
                tools.RecordVisitorLogEntry(visitorLog);
            }
            catch (Exception ex)
            {
                // just swallow the exception since there's no handling
            }
        }
    }
}
