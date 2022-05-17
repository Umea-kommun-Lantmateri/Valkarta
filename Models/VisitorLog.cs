using System;

namespace Valkarta.Models
{
    public class VisitorLog
    {
        public string UserAgent { get; set; }
        public DateTime DateVisited { get; set; }
        public int CurrentScreenWidth { get; set; }
        public int CurrentScreenHeight { get; set; }
    }
}
